<?php

namespace App\Modules\Identity\Models;

use App\Modules\Identity\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['username', 'password', 'role', 'is_active'])]
#[Hidden(['password', 'remember_token'])]
final class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /** @var array<string, int|bool> */
    protected $attributes = [
        'role' => UserRole::Admin->value,
        'is_active' => true,
    ];

    /**
     * Create the dedicated factory for the module user model.
     */
    protected static function newFactory(): UserFactory
    {
        return UserFactory::new();
    }

    /**
     * Define model casts for database-backed identity attributes.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'role' => UserRole::class,
            'is_active' => 'boolean',
            'deleted_at' => 'datetime',
        ];
    }
}
