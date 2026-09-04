<?php

namespace App\Modules\Identity\Http\Resources;

use App\Modules\FileManagement\Models\FileLink;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\Identity\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Profile */
final class AvatarResource extends JsonResource
{
    /** Return the nullable public avatar union without exposing file storage coordinates. */
    public function toArray(Request $request): ?array
    {
        $config = $this->avatar_config;

        if ($config === null) {
            return null;
        }

        if (($config['type'] ?? null) === 'dicebear') {
            return [
                'type' => 'dicebear',
                'style' => $config['style'],
                'seed' => $config['seed'],
                'options' => $config['options'],
            ];
        }

        $link = $this->resource->relationLoaded('avatarFileLink')
            ? $this->resource->getRelation('avatarFileLink')
            : null;
        $file = $link instanceof FileLink && $link->relationLoaded('file')
            ? $link->getRelation('file')
            : null;

        if (($config['type'] ?? null) !== 'file' || ! $file instanceof ManagedFile) {
            return null;
        }

        return [
            'type' => 'file',
            'file_id' => $file->id,
            'content_url' => route('api.v1.files.content', ['file' => $file->id], false),
        ];
    }
}
