<?php

namespace App\Modules\FileManagement\Models;

use App\Modules\Identity\Models\User;
use Database\Factories\ManagedFileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'original_name',
    'display_name',
    'disk',
    'path',
    'extension',
    'mime_type',
    'size_bytes',
])]
final class ManagedFile extends Model
{
    /** @use HasFactory<ManagedFileFactory> */
    use HasFactory, SoftDeletes;

    protected $table = 'files';

    /**
     * Create the dedicated factory for the managed file model.
     */
    protected static function newFactory(): ManagedFileFactory
    {
        return ManagedFileFactory::new();
    }

    /**
     * Define model casts for managed file attributes.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Return the account that permanently owns this file.
     *
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    /**
     * Return every domain usage link for this file.
     *
     * @return HasMany<FileLink, $this>
     */
    public function links(): HasMany
    {
        return $this->hasMany(FileLink::class, 'file_id');
    }
}
