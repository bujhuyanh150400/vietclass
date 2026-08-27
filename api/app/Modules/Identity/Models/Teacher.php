<?php

namespace App\Modules\Identity\Models;

use App\Modules\Identity\Enums\EmployeeStatus;
use Database\Factories\TeacherFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'full_name',
    'phone',
    'email',
    'address',
    'bank_bin',
    'bank_name',
    'bank_account_number',
    'bank_account_holder',
    'status',
    'color',
    'joined_at',
])]
final class Teacher extends Model
{
    /** @use HasFactory<TeacherFactory> */
    use HasFactory;

    /** @var array<string, int> */
    protected $attributes = [
        'status' => EmployeeStatus::Active->value,
    ];

    /**
     * Create the dedicated factory for the teacher model.
     */
    protected static function newFactory(): TeacherFactory
    {
        return TeacherFactory::new();
    }

    /**
     * Define model casts for database-backed teacher attributes.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => EmployeeStatus::class,
            'joined_at' => 'date',
        ];
    }

    /**
     * Return the login account this profile belongs to.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
