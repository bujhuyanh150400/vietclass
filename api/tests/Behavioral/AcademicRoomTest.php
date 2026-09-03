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
use App\Modules\Academic\Enums\RoomStatus;
use App\Modules\Academic\Models\Room;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\User;

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

    $this->getJson('/api/v1/rooms?per_page=1&status=0')
        ->assertOk()
        ->assertJsonPath('meta.current_page', 1)
        ->assertJsonPath('meta.per_page', 1)
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.name', 'Phòng A')
        ->assertJsonStructure([
            'data' => [['id', 'name', 'capacity', 'note', 'status', 'created_at', 'updated_at']],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
        ]);
});

test('the room options endpoint returns only active rooms', function (): void {
    Room::factory()->create(['name' => 'Phòng A', 'status' => RoomStatus::Active]);
    Room::factory()->create(['name' => 'Phòng B', 'status' => RoomStatus::Maintenance]);

    $this->getJson('/api/v1/rooms/options')
        ->assertOk()
        ->assertJsonPath('data.0.label', 'Phòng A')
        ->assertJsonCount(1, 'data');
});

test('room endpoints create, show, update, change status, and delete a room', function (): void {
    $created = $this->postJson('/api/v1/rooms', [
        'name' => 'Phòng A1',
        'capacity' => 36,
        'note' => 'Tầng một',
    ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Phòng A1')
        ->assertJsonPath('data.status', RoomStatus::Active->value);

    $roomId = $created->json('data.id');

    $this->getJson("/api/v1/rooms/{$roomId}")
        ->assertOk()
        ->assertJsonPath('data.capacity', 36);

    $this->putJson("/api/v1/rooms/{$roomId}", [
        'name' => 'Phòng A2',
        'capacity' => 40,
        'note' => 'Tầng hai',
    ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Phòng A2')
        ->assertJsonPath('data.capacity', 40);

    $this->patchJson("/api/v1/rooms/{$roomId}/status", ['status' => RoomStatus::Maintenance->value])
        ->assertOk()
        ->assertJsonPath('data.status', RoomStatus::Maintenance->value);

    $this->deleteJson("/api/v1/rooms/{$roomId}")->assertNoContent();

    $this->assertDatabaseMissing('rooms', ['id' => $roomId]);
});

test('a duplicate room name is reported against the name field', function (): void {
    Room::factory()->create(['name' => 'Phòng A1']);

    $this->postJson('/api/v1/rooms', [
        'name' => 'Phòng A1',
        'capacity' => 36,
    ])
        ->assertJsonValidationErrorFor('name')
        ->assertJsonPath('errors.name.0', 'Tên phòng học này đã tồn tại trong hệ thống.');
});

test('a negative room capacity is reported against the capacity field', function (): void {
    $this->postJson('/api/v1/rooms', [
        'name' => 'Phòng A1',
        'capacity' => -1,
    ])->assertJsonValidationErrorFor('capacity');
});

test('a room accepts PostgreSQL smallint maximum capacity', function (): void {
    $this->postJson('/api/v1/rooms', [
        'name' => 'Phòng A1',
        'capacity' => 32767,
    ])
        ->assertCreated()
        ->assertJsonPath('data.capacity', 32767);
});

test('a room capacity above PostgreSQL smallint range is reported against the capacity field', function (): void {
    $room = Room::factory()->create();

    $this->postJson('/api/v1/rooms', [
        'name' => 'Phòng A1',
        'capacity' => 32768,
    ])->assertJsonValidationErrorFor('capacity');

    $this->putJson("/api/v1/rooms/{$room->id}", [
        'name' => 'Phòng A2',
        'capacity' => 32768,
    ])->assertJsonValidationErrorFor('capacity');
});

test('a room status outside the declared states is rejected', function (): void {
    $room = Room::factory()->create();

    $this->patchJson("/api/v1/rooms/{$room->id}/status", ['status' => 99])
        ->assertJsonValidationErrorFor('status');
});

test('a non-administrator cannot use any room endpoint', function (): void {
    $room = Room::factory()->create();
    $teacher = User::factory()->create(['role' => UserRole::Teacher]);

    $this->withToken($teacher->createToken('test')->plainTextToken);

    $this->getJson('/api/v1/rooms')->assertForbidden();
    $this->getJson('/api/v1/rooms/options')->assertForbidden();
    $this->postJson('/api/v1/rooms', ['name' => 'Phòng A1', 'capacity' => 24])->assertForbidden();
    $this->getJson("/api/v1/rooms/{$room->id}")->assertForbidden();
    $this->putJson("/api/v1/rooms/{$room->id}", ['name' => 'Phòng A1', 'capacity' => 24])->assertForbidden();
    $this->patchJson("/api/v1/rooms/{$room->id}/status", ['status' => RoomStatus::Inactive->value])
        ->assertForbidden();
    $this->deleteJson("/api/v1/rooms/{$room->id}")->assertForbidden();
});
