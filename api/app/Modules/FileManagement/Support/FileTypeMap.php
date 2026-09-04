<?php

namespace App\Modules\FileManagement\Support;

use Illuminate\Support\Str;

final class FileTypeMap
{
    private const CATEGORIES = [
        'image' => ['jpg', 'jpeg', 'png', 'webp'],
        'pdf' => ['pdf'],
        'document' => ['doc', 'docx'],
        'spreadsheet' => ['xls', 'xlsx'],
        'presentation' => ['ppt', 'pptx'],
        'text' => ['csv', 'txt'],
    ];

    private const TYPES = [
        'jpg' => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png' => ['image/png'],
        'webp' => ['image/webp'],
        'pdf' => ['application/pdf'],
        'doc' => ['application/msword', 'application/x-ole-storage', 'application/vnd.ms-office'],
        'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
        'xls' => ['application/vnd.ms-excel', 'application/x-ole-storage', 'application/vnd.ms-office'],
        'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip'],
        'ppt' => ['application/vnd.ms-powerpoint', 'application/x-ole-storage', 'application/vnd.ms-office'],
        'pptx' => ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip'],
        'csv' => ['text/csv', 'text/plain'],
        'txt' => ['text/plain'],
    ];

    /**
     * Resolve a normalized allowlist entry only when the detected MIME matches its extension.
     *
     * @return array{category: string, extension: string, mime_type: string}|null
     */
    public static function resolve(string $extension, string $mimeType): ?array
    {
        $extension = Str::lower($extension);

        if (! in_array($mimeType, self::TYPES[$extension] ?? [], true)) {
            return null;
        }

        return [
            'category' => self::category($extension),
            'extension' => $extension,
            'mime_type' => $mimeType,
        ];
    }

    /** Return the file-library category for one validated extension. */
    public static function category(string $extension): string
    {
        foreach (self::CATEGORIES as $category => $extensions) {
            if (in_array(Str::lower($extension), $extensions, true)) {
                return $category;
            }
        }

        return 'text';
    }

    /** Return the validated extensions belonging to one exact library category. */
    public static function extensionsForCategory(string $category): array
    {
        return self::CATEGORIES[$category] ?? [];
    }
}
