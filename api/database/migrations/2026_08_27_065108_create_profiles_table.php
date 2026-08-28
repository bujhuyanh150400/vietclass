<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            // NULL khi người này chưa có tài khoản đăng nhập. Phụ huynh nhập từ form
            // học sinh bắt đầu ở trạng thái đó; cấp tài khoản sau chỉ là một lần UPDATE.
            $table->foreignId('user_id')->nullable()->unique()->constrained();
            // Collation tiếng Việt ngay trên cột: mọi truy vấn sắp xếp theo tên đều đúng
            // thứ tự chữ cái tiếng Việt mà không cần lặp lại COLLATE ở từng câu truy vấn.
            $table->string('full_name', 255)->collation('vi-VN-x-icu');
            // Không UNIQUE: giáo viên được phép dùng chính số của mình làm số phụ huynh
            // cho con. Index vẫn cần cho tìm kiếm và cho bước dò trùng phụ huynh.
            $table->string('phone', 20)->nullable()->index();
            // Không UNIQUE: giáo viên, học sinh và phụ huynh dùng chung bảng này, phần lớn
            // học sinh và phụ huynh không có email. Không tầng nào kiểm tra trùng lặp.
            $table->string('email', 255)->nullable();
            $table->date('dob')->nullable();
            $table->smallInteger('gender');
            $table->text('address')->nullable();
            $table->text('note')->nullable();
            // Chỉ dành cho dữ liệu import thô và trường tùy biến. Dữ liệu bị lọc, sắp
            // xếp, tham chiếu khóa ngoại hoặc validate phải là cột thật.
            $table->jsonb('metadata')->default(DB::raw("'{}'::jsonb"));
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
