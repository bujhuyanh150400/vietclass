<?php

namespace App\Modules\FileManagement\Models;

use App\Modules\FileManagement\Enums\FileLinkType;
use Database\Factories\FileLinkFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['file_id', 'type', 'foreign_id'])]
final class FileLink extends Model
{
    /** @use HasFactory<FileLinkFactory> */
    use HasFactory;

    /**
     * Create the dedicated factory for the managed file link model.
     */
    protected static function newFactory(): FileLinkFactory
    {
        return FileLinkFactory::new();
    }

    /**
     * Define model casts for managed file link attributes.
     *
     * @return array<string, class-string<FileLinkType>>
     */
    protected function casts(): array
    {
        return [
            'type' => FileLinkType::class,
        ];
    }

    /**
     * Return the managed file used by this domain link.
     *
     * @return BelongsTo<ManagedFile, $this>
     */
    public function file(): BelongsTo
    {
        return $this->belongsTo(ManagedFile::class);
    }
}
