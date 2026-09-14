<?php

namespace App\Modules\Academic\Models;

use App\Modules\Academic\Enums\RoomStatus;
use Database\Factories\RoomFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'capacity', 'location', 'note', 'status', 'facilities'])]
final class Room extends Model
{
    /** @use HasFactory<RoomFactory> */
    use HasFactory;

    /** @var array<string, int|string> */
    protected $attributes = [
        'capacity' => 0,
        'status' => RoomStatus::Active->value,
        // Raw JSON rather than [], so an unsaved model reads back an empty list
        // through the cast instead of null.
        'facilities' => '[]',
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
            // Plain array rather than an enum collection: the column stores
            // ClassroomFacility integers and every reader wants them as integers.
            'facilities' => 'array',
        ];
    }
}
