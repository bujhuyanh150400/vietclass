<?php

namespace App\Modules\FileManagement\Console\Commands;

use App\Modules\FileManagement\Actions\PurgeTrashedFilesAction;
use Illuminate\Console\Command;

final class PurgeTrashedFilesCommand extends Command
{
    /** @var string */
    protected $signature = 'files:purge-trash';

    /** @var string */
    protected $description = 'Xóa vĩnh viễn các tệp trong thùng rác quá 30 ngày.';

    /** Run the scheduled purge and return a failing exit code only for storage cleanup failures. */
    public function handle(PurgeTrashedFilesAction $purge): int
    {
        $result = $purge->handle();
        $this->components->info("Đã purge {$result['purged']} tệp; {$result['linked']} tệp còn được sử dụng.");

        if ($result['failed'] > 0) {
            $this->components->error("Không thể xóa {$result['failed']} tệp; sẽ thử lại trong lần chạy sau.");

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
