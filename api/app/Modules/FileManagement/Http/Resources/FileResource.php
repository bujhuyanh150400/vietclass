<?php

namespace App\Modules\FileManagement\Http\Resources;

use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\FileManagement\Support\FileTypeMap;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ManagedFile */
final class FileResource extends JsonResource
{
    /** Transform file metadata without exposing its private storage location. */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'owner' => [
                'id' => $this->owner->id,
                'display_name' => $this->owner->profile?->full_name ?? $this->owner->username,
                'role' => $this->owner->role->value,
            ],
            'original_name' => $this->original_name,
            'display_name' => $this->display_name,
            'category' => FileTypeMap::category($this->extension),
            'extension' => $this->extension,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'is_linked' => $this->links->isNotEmpty(),
            'link_types' => $this->links->pluck('type')->map->value->values(),
            'trashed_at' => $this->deleted_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'content_url' => route('api.v1.files.content', ['file' => $this->id], false),
        ];
    }
}
