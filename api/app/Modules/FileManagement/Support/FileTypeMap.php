<?php

namespace App\Modules\FileManagement\Support;

use Illuminate\Support\Str;

final class FileTypeMap
{
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
            'category' => match ($extension) {
                'jpg', 'jpeg', 'png', 'webp' => 'image',
                'pdf' => 'pdf',
                'doc', 'docx' => 'document',
                'xls', 'xlsx' => 'spreadsheet',
                'ppt', 'pptx' => 'presentation',
                default => 'text',
            },
            'extension' => $extension,
            'mime_type' => $mimeType,
        ];
    }
}
