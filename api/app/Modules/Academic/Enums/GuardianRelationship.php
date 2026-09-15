<?php

namespace App\Modules\Academic\Enums;

use App\Core\Support\IntBackedEnum;

/**
 * Quan hệ của một người với học sinh trong bảng liên kết `student_guardians`.
 *
 * Không phải người liên hệ nào cũng là bố hoặc mẹ: ông bà, anh chị đã thành niên hay
 * người được tòa chỉ định đều có thể là người nhà trường phải gọi. `Guardian` gom hết
 * những trường hợp đó dưới đúng tên gọi của vai trò, nên danh sách chỉ có ba lựa chọn
 * chứ không kèm một ô "Khác" không nói thêm được điều gì.
 */
enum GuardianRelationship: int
{
    use IntBackedEnum;

    case Father = 0;
    case Mother = 1;
    case Guardian = 2;
}
