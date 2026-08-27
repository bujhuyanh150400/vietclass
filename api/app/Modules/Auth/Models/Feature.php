<?php

namespace App\Modules\Auth\Models;

use Database\Factories\FeatureFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['code', 'name', 'group_code', 'description'])]
final class Feature extends Model
{
    /** @use HasFactory<FeatureFactory> */
    use HasFactory;

    /**
     * Create the dedicated factory for the permission catalogue model.
     */
    protected static function newFactory(): FeatureFactory
    {
        return FeatureFactory::new();
    }
}
