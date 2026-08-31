<?php

namespace App\Modules\Academic\Models;

use App\Modules\Academic\Enums\RoomStatus;
use Database\Factories\RoomFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'capacity', 'note', 'status'])]
final class Room extends Model
{
    /** @use HasFactory<RoomFactory> */
    use HasFactory;

    /** @var array<string, int> */
    protected $attributes = [
        'capacity' => 0,
        'status' => RoomStatus::Active->value,
    ];

    /**
     * Create the dedicated factory for the room model.
     */
    protected static function newFactory(): RoomFactory
    {
        return RoomFactory::new();
    }

    /**
     * Define model casts for database-backed room attributes.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'status' => RoomStatus::class,
        ];
    }
}
