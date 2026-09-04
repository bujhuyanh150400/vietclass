<?php

namespace App\Modules\System\Models;

use Database\Factories\SystemSettingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['key', 'value', 'description', 'updated_by'])]
final class SystemSetting extends Model
{
    /** @use HasFactory<SystemSettingFactory> */
    use HasFactory;

    /** Create the dedicated factory for the system setting model. */
    protected static function newFactory(): SystemSettingFactory
    {
        return SystemSettingFactory::new();
    }

    /**
     * Define model casts for system setting attributes.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }
}
