<?php

use App\Core\Data\ListQuery;
use App\Modules\Academic\Actions\ChangeRoomStatusAction;
use App\Modules\Academic\Actions\CreateRoomAction;
use App\Modules\Academic\Actions\DeleteRoomAction;
use App\Modules\Academic\Actions\GetRoomAction;
use App\Modules\Academic\Actions\ListRoomOptionsAction;
use App\Modules\Academic\Actions\ListRoomsAction;
use App\Modules\Academic\Actions\UpdateRoomAction;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassroomFacility;
use App\Modules\Academic\Enums\RoomStatus;
use App\Modules\Academic\Models\Room;
use App\Modules\Auth\Enums\UserRole;
use App\Modules\Auth\Models\User;

beforeEach(function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->withToken($admin->createToken('test')->plainTextToken);
});

test('a room is created with its submitted details', function (): void {
    $result = app(CreateRoomAction::class)->handle([
        'name' => 'Phòng A1',
        'capacity' => 36,
        'note' => 'Tầng một',
    ]);

    expect($result->isSuccess())->toBeTrue()
        ->and($result->getData()->name)->toBe('Phòng A1')
        ->and($result->getData()->capacity)->toBe(36)
        ->and($result->getData()->status)->toBe(RoomStatus::Active);

    $this->assertDatabaseHas('rooms', [
        'name' => 'Phòng A1',
        'capacity' => 36,
        'note' => 'Tầng một',
        'status' => RoomStatus::Active->value,
    ]);
});

test('a room can have its editable details updated', function (): void {
    $room = Room::factory()->create(['name' => 'Phòng A1', 'capacity' => 24]);

    $result = app(UpdateRoomAction::class)->handle($room->id, [
        'name' => 'Phòng A2',
        'capacity' => 32,
        'note' => 'Tầng hai',
    ]);

    expect($result->isSuccess())->toBeTrue()
        ->and($result->getData()->name)->toBe('Phòng A2')
        ->and($result->getData()->capacity)->toBe(32)
        ->and($result->getData()->note)->toBe('Tầng hai');
});

test('a room status can be changed independently from its details', function (): void {
    $room = Room::factory()->create(['status' => RoomStatus::Active]);

    $result = app(ChangeRoomStatusAction::class)->handle($room->id, RoomStatus::Maintenance);

    expect($result->isSuccess())->toBeTrue()
        ->and($result->getData()->status)->toBe(RoomStatus::Maintenance);
});

test('an unreferenced room can be deleted', function (): void {
    $room = Room::factory()->create();

    $result = app(DeleteRoomAction::class)->handle($room->id);

    expect($result->isSuccess())->toBeTrue();

    $this->assertDatabaseMissing('rooms', ['id' => $room->id]);
});

test('room operations report a missing room consistently', function (): void {
    expect(app(GetRoomAction::class)->handle(9999)->getError())
        ->toBe(AcademicError::RoomNotFound)
        ->and(app(UpdateRoomAction::class)->handle(9999, [
            'name' => 'Phòng A1',
            'capacity' => 0,
            'note' => null,
        ])->getError())->toBe(AcademicError::RoomNotFound)
        ->and(app(ChangeRoomStatusAction::class)->handle(9999, RoomStatus::Inactive)->getError())
        ->toBe(AcademicError::RoomNotFound)
        ->and(app(DeleteRoomAction::class)->handle(9999)->getError())
        ->toBe(AcademicError::RoomNotFound);
});

test('rooms are searched, filtered, and paginated through the shared list query', function (): void {
    Room::factory()->create(['name' => 'Phòng Toán A', 'status' => RoomStatus::Active]);
    Room::factory()->create(['name' => 'Phòng Toán B', 'status' => RoomStatus::Active]);
    Room::factory()->create(['name' => 'Phòng Toán C', 'status' => RoomStatus::Inactive]);
    Room::factory()->create(['name' => 'Phòng Văn A', 'status' => RoomStatus::Active]);

    $result = app(ListRoomsAction::class)->handle(new ListQuery(
        perPage: 1,
        search: 'toán',
        sort: 'name',
        direction: 'asc',
        filters: ['status' => RoomStatus::Active],
    ));

    expect($result->isSuccess())->toBeTrue()
        ->and($result->getData()->total())->toBe(2)
        ->and($result->getData()->items()[0]->name)->toBe('Phòng Toán A');
});

test('room options contain only active rooms', function (): void {
    Room::factory()->create(['name' => 'Phòng A', 'status' => RoomStatus::Active]);
    Room::factory()->create(['name' => 'Phòng B', 'status' => RoomStatus::Inactive]);
    Room::factory()->create(['name' => 'Phòng C', 'status' => RoomStatus::Maintenance]);

    $result = app(ListRoomOptionsAction::class)->handle(new ListQuery);

    expect($result->isSuccess())->toBeTrue()
        ->and($result->getData()->pluck('name')->all())->toBe(['Phòng A']);
});

test('the room list uses the shared pagination envelope and status filter', function (): void {
    Room::factory()->create(['name' => 'Phòng A', 'status' => RoomStatus::Active]);
    Room::factory()->create(['name' => 'Phòng B', 'status' => RoomStatus::Inactive]);

    $this->getJson('/api/v1/academic/rooms?per_page=1&status=0')
        ->assertOk()
        ->assertJsonPath('meta.current_page', 1)
        ->assertJsonPath('meta.per_page', 1)
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.name', 'Phòng A')
        ->assertJsonStructure([
            'data' => [['id', 'name', 'capacity', 'location', 'facilities', 'note', 'status', 'created_at', 'updated_at']],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
        ]);
});

test('the room options endpoint returns only active rooms', function (): void {
    Room::factory()->create(['name' => 'Phòng A', 'status' => RoomStatus::Active]);
    Room::factory()->create(['name' => 'Phòng B', 'status' => RoomStatus::Maintenance]);

    $this->getJson('/api/v1/academic/rooms/options')
        ->assertOk()
        ->assertJsonPath('data.0.label', 'Phòng A')
        ->assertJsonCount(1, 'data');
});

test('room endpoints create, show, update, change status, and delete a room', function (): void {
    $created = $this->postJson('/api/v1/academic/rooms', [
        'name' => 'Phòng A1',
        'capacity' => 36,
        'note' => 'Tầng một',
    ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Phòng A1')
        ->assertJsonPath('data.status', RoomStatus::Active->value);

    $roomId = $created->json('data.id');

    $this->getJson("/api/v1/academic/rooms/{$roomId}")
        ->assertOk()
        ->assertJsonPath('data.capacity', 36);

    $this->putJson("/api/v1/academic/rooms/{$roomId}", [
        'name' => 'Phòng A2',
        'capacity' => 40,
        'note' => 'Tầng hai',
    ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Phòng A2')
        ->assertJsonPath('data.capacity', 40);

    $this->patchJson("/api/v1/academic/rooms/{$roomId}/status", ['status' => RoomStatus::Maintenance->value])
        ->assertOk()
        ->assertJsonPath('data.status', RoomStatus::Maintenance->value);

    $this->deleteJson("/api/v1/academic/rooms/{$roomId}")->assertNoContent();

    $this->assertDatabaseMissing('rooms', ['id' => $roomId]);
});

test('a duplicate room name is reported against the name field', function (): void {
    Room::factory()->create(['name' => 'Phòng A1']);

    $this->postJson('/api/v1/academic/rooms', [
        'name' => 'Phòng A1',
        'capacity' => 36,
    ])
        ->assertJsonValidationErrorFor('name')
        ->assertJsonPath('errors.name.0', 'Tên phòng học này đã tồn tại trong hệ thống.');
});

test('a negative room capacity is reported against the capacity field', function (): void {
    $this->postJson('/api/v1/academic/rooms', [
        'name' => 'Phòng A1',
        'capacity' => -1,
    ])->assertJsonValidationErrorFor('capacity');
});

test('a room accepts PostgreSQL smallint maximum capacity', function (): void {
    $this->postJson('/api/v1/academic/rooms', [
        'name' => 'Phòng A1',
        'capacity' => 32767,
    ])
        ->assertCreated()
        ->assertJsonPath('data.capacity', 32767);
});

test('a room capacity above PostgreSQL smallint range is reported against the capacity field', function (): void {
    $room = Room::factory()->create();

    $this->postJson('/api/v1/academic/rooms', [
        'name' => 'Phòng A1',
        'capacity' => 32768,
    ])->assertJsonValidationErrorFor('capacity');

    $this->putJson("/api/v1/academic/rooms/{$room->id}", [
        'name' => 'Phòng A2',
        'capacity' => 32768,
    ])->assertJsonValidationErrorFor('capacity');
});

test('a room status outside the declared states is rejected', function (): void {
    $room = Room::factory()->create();

    $this->patchJson("/api/v1/academic/rooms/{$room->id}/status", ['status' => 99])
        ->assertJsonValidationErrorFor('status');
});

test('a non-administrator cannot use any room endpoint', function (): void {
    $room = Room::factory()->create();
    $teacher = User::factory()->create(['role' => UserRole::Teacher]);

    $this->withToken($teacher->createToken('test')->plainTextToken);

    $this->getJson('/api/v1/academic/rooms')->assertForbidden();
    $this->getJson('/api/v1/academic/rooms/options')->assertForbidden();
    $this->postJson('/api/v1/academic/rooms', ['name' => 'Phòng A1', 'capacity' => 24])->assertForbidden();
    $this->getJson("/api/v1/academic/rooms/{$room->id}")->assertForbidden();
    $this->putJson("/api/v1/academic/rooms/{$room->id}", ['name' => 'Phòng A1', 'capacity' => 24])->assertForbidden();
    $this->patchJson("/api/v1/academic/rooms/{$room->id}/status", ['status' => RoomStatus::Inactive->value])
        ->assertForbidden();
    $this->deleteJson("/api/v1/academic/rooms/{$room->id}")->assertForbidden();
});

test('a room records the facilities and location it was created with', function (): void {
    $created = $this->postJson('/api/v1/academic/rooms', [
        'name' => 'Phòng Tin học',
        'capacity' => 32,
        'location' => 'Tầng 3 · Dãy B',
        'facilities' => [
            ClassroomFacility::Computer->value,
            ClassroomFacility::Projector->value,
        ],
    ])->assertCreated();

    $created->assertJsonPath('data.location', 'Tầng 3 · Dãy B')
        ->assertJsonPath('data.facilities', [
            ClassroomFacility::Computer->value,
            ClassroomFacility::Projector->value,
        ]);

    $room = Room::query()->findOrFail($created->json('data.id'));

    expect($room->facilities)->toBe([2, 0])
        ->and($room->location)->toBe('Tầng 3 · Dãy B');
});

test('a room defaults to an empty facility list', function (): void {
    $room = Room::query()->create(['name' => 'Phòng trống', 'capacity' => 10]);

    expect($room->refresh()->facilities)->toBe([])
        ->and($room->location)->toBeNull();
});

test('a facility outside the declared enum is refused', function (): void {
    $this->postJson('/api/v1/academic/rooms', [
        'name' => 'Phòng A1',
        'capacity' => 30,
        'facilities' => [ClassroomFacility::Wifi->value + 1],
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('facilities.0');
});

test('the facility filter returns only rooms carrying every facility asked for', function (): void {
    Room::factory()->create([
        'name' => 'Phòng đủ',
        'facilities' => [ClassroomFacility::Projector->value, ClassroomFacility::Wifi->value],
    ]);
    Room::factory()->create([
        'name' => 'Phòng thiếu',
        'facilities' => [ClassroomFacility::Projector->value],
    ]);

    $this->getJson('/api/v1/academic/rooms?facilities[]=0&facilities[]=9')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Phòng đủ');
});

// The query string carries "0" where the JSON body carried 0, and jsonb tells the two
// apart. Without the coercion in IndexRoomRequest and the store request this filter
// matches nothing at all, and nothing anywhere reports an error.
test('a facility filter sent as a query string matches a room saved from a JSON body', function (): void {
    $this->postJson('/api/v1/academic/rooms', [
        'name' => 'Phòng Hội trường',
        'capacity' => 200,
        'facilities' => [ClassroomFacility::Speaker->value],
    ])->assertCreated();

    $this->getJson('/api/v1/academic/rooms?facilities[]=4')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Phòng Hội trường');
});

test('an empty facility filter narrows nothing', function (): void {
    Room::factory()->count(2)->create(['facilities' => []]);

    $this->getJson('/api/v1/academic/rooms?facilities[]=')
        ->assertStatus(422)
        ->assertJsonValidationErrors('facilities.0');

    $this->getJson('/api/v1/academic/rooms')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

test('the capacity range filter narrows the list at both ends', function (): void {
    Room::factory()->create(['name' => 'Phòng nhỏ', 'capacity' => 10]);
    Room::factory()->create(['name' => 'Phòng vừa', 'capacity' => 40]);
    Room::factory()->create(['name' => 'Phòng lớn', 'capacity' => 120]);

    $this->getJson('/api/v1/academic/rooms?capacity_min=20&capacity_max=100')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Phòng vừa');
});

test('the room search also matches a location', function (): void {
    Room::factory()->create(['name' => 'Phòng A', 'location' => 'Tầng 3 · Dãy B']);
    Room::factory()->create(['name' => 'Phòng B', 'location' => 'Tầng 1 · Dãy A']);

    $this->getJson('/api/v1/academic/rooms?q=Tang 3')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Phòng A');
});

test('the room update endpoint changes availability status alongside the other fields', function (): void {
    $room = Room::factory()->create(['name' => 'Phòng A', 'status' => RoomStatus::Active]);

    $this->putJson("/api/v1/academic/rooms/{$room->id}", [
        'name' => 'Phòng A',
        'capacity' => 44,
        'status' => RoomStatus::Maintenance->value,
        'facilities' => [ClassroomFacility::Whiteboard->value],
    ])
        ->assertOk()
        ->assertJsonPath('data.status', RoomStatus::Maintenance->value)
        ->assertJsonPath('data.capacity', 44)
        ->assertJsonPath('data.facilities', [ClassroomFacility::Whiteboard->value]);
});

test('the room update endpoint leaves status untouched when none is submitted', function (): void {
    $room = Room::factory()->create(['name' => 'Phòng A', 'status' => RoomStatus::Maintenance]);

    $this->putJson("/api/v1/academic/rooms/{$room->id}", ['name' => 'Phòng A', 'capacity' => 44])
        ->assertOk()
        ->assertJsonPath('data.status', RoomStatus::Maintenance->value);
});
