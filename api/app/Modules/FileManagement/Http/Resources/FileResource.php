<?php

namespace App\Modules\FileManagement\Http\Resources;

use App\Modules\FileManagement\Models\ManagedFile;
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
            'owner_id' => $this->owner_user_id,
            'original_name' => $this->original_name,
            'display_name' => $this->display_name,
            'extension' => $this->extension,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
