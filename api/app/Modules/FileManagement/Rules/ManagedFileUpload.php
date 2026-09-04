<?php

namespace App\Modules\FileManagement\Rules;

use App\Modules\FileManagement\Support\FileTypeMap;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use ZipArchive;

final class ManagedFileUpload implements ValidationRule
{
    private const MAX_SIZE_BYTES = 25 * 1024 * 1024;

    /** Create the shared upload boundary, optionally restricted to image types. */
    public function __construct(private readonly bool $imagesOnly = false) {}

    /** Validate a successful upload against the server-detected MIME and extension allowlist. */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile || ! $value->isValid() || $value->getSize() > self::MAX_SIZE_BYTES) {
            $fail('The :attribute must be a valid file no larger than 25 MiB.');

            return;
        }

        $extension = Str::lower($value->getClientOriginalExtension());
        $mimeType = $value->getMimeType();
        $contentMimeType = $this->contentMimeType($value);

        if (! is_string($mimeType) || $contentMimeType === null || $mimeType !== $contentMimeType
            || ($resolved = FileTypeMap::resolve($extension, $contentMimeType)) === null) {
            $fail('The :attribute type is not allowed.');

            return;
        }

        if (($this->imagesOnly && $resolved['category'] !== 'image') || ! $this->hasValidOoxmlContents($value, $extension)) {
            $fail('The :attribute type is not allowed.');
        }
    }

    /** Confirm the uploaded bytes agree with Symfony's server-detected MIME type. */
    private function contentMimeType(UploadedFile $file): ?string
    {
        $path = $file->getRealPath();
        $finfo = $path === false ? false : finfo_open(FILEINFO_MIME_TYPE);

        if ($finfo === false) {
            return null;
        }

        $mimeType = finfo_file($finfo, $path);
        finfo_close($finfo);

        return is_string($mimeType) ? $mimeType : null;
    }

    /** Verify OOXML archives contain their required document part and are not macro-enabled. */
    private function hasValidOoxmlContents(UploadedFile $file, string $extension): bool
    {
        $requiredPart = match ($extension) {
            'docx' => 'word/document.xml',
            'xlsx' => 'xl/workbook.xml',
            'pptx' => 'ppt/presentation.xml',
            default => null,
        };

        if ($requiredPart === null || ! class_exists(ZipArchive::class)) {
            return $requiredPart === null;
        }

        $archive = new ZipArchive;
        $path = $file->getRealPath();

        if ($path === false || $archive->open($path) !== true) {
            return false;
        }

        $contentTypes = $archive->getFromName('[Content_Types].xml');
        $isValid = is_string($contentTypes)
            && ! str_contains($contentTypes, 'macroEnabled')
            && $archive->locateName($requiredPart) !== false;

        $archive->close();

        return $isValid;
    }
}
