<?php

namespace App\Modules\Auth\Console;

use App\Modules\Auth\Repositories\FeatureRepository;
use App\Modules\Auth\Support\FeatureRegistry;
use Illuminate\Console\Command;

final class SyncFeaturesCommand extends Command
{
    /** @var string */
    protected $signature = 'auth:sync-features';

    /** @var string */
    protected $description = 'Đồng bộ danh mục quyền trong cơ sở dữ liệu với khai báo trong mã nguồn.';

    /**
     * Mirror every declared permission into the catalogue and report codes no module
     * owns any more, without deleting them and their per-user overrides.
     */
    public function handle(FeatureRegistry $registry, FeatureRepository $features): int
    {
        $declared = $registry->all();
        $written = $features->upsertMany($declared);

        $this->components->info("Đã đồng bộ {$written} quyền.");

        $orphans = $features->orphanCodes(array_keys($declared));

        if ($orphans !== []) {
            $this->components->warn(
                'Các quyền sau còn trong cơ sở dữ liệu nhưng không còn được khai báo: '
                .implode(', ', $orphans)
                .'. Chúng không bị xóa để giữ lại phân quyền riêng của người dùng.',
            );
        }

        return self::SUCCESS;
    }
}
