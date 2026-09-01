<?php

namespace App\Modules\Schedule\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Schedule\Enums\ScheduleError;
use App\Modules\Schedule\Support\ProjectedSession;
use App\Modules\Schedule\Support\ScheduleProjector;
use Illuminate\Support\Carbon;

final class ListScheduleSessionsAction
{
    /**
     * The widest calendar one read may cover, counting both bounds.
     *
     * Roughly a quarter, which is the longest span a person plans against in one view.
     * The limit exists because the projection walks every day in the range in PHP: an
     * unbounded range is an unbounded amount of work asked for by a single query string.
     */
    private const MAX_RANGE_DAYS = 92;

    /**
     * Create the action with the projection it reads the calendar through.
     */
    public function __construct(
        private readonly ScheduleProjector $projector,
    ) {}

    /**
     * Return every session between two inclusive dates — the written rows and the
     * projected ones together, ordered as a calendar reads.
     *
     * A caller sees one kind of thing, not two: a session that happens to have a row
     * behind it carries an identifier and one that does not carries null, and nothing
     * else about them differs. The written row wins wherever both describe the same
     * lesson, so the same lesson never appears twice.
     *
     * `$teacherProfileScope` is the read scope of the caller, not a filter they chose: a
     * teacher may only see lessons they are on, in either role, projected ones included.
     * It is applied here rather than in middleware because middleware can only answer yes
     * or no, not "these rows and not those". A scoped caller asking after somebody else's
     * calendar is answered with an empty calendar rather than an error — they are entitled
     * to ask, and the honest answer is that they can see none of it.
     *
     * @return ActionResult<list<ProjectedSession>, ScheduleError>
     */
    public function handle(
        string $from,
        string $to,
        ?int $classId = null,
        ?int $teacherProfileId = null,
        ?int $roomId = null,
        ?int $teacherProfileScope = null,
    ): ActionResult {
        try {
            $opensOn = Carbon::parse($from)->startOfDay();
            $closesOn = Carbon::parse($to)->startOfDay();

            $this->assertRangeIsNarrowEnough($opensOn, $closesOn);

            if ($teacherProfileScope !== null && $teacherProfileId !== null
                && $teacherProfileId !== $teacherProfileScope) {
                return ActionResult::success([]);
            }

            return ActionResult::success($this->projector->project(
                from: $opensOn->toDateString(),
                to: $closesOn->toDateString(),
                classId: $classId,
                teacherProfileId: $teacherProfileScope ?? $teacherProfileId,
                roomId: $roomId,
            ));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }

    /**
     * Refuse a range wider than one read may cover, naming the limit so the caller can
     * split the request rather than guess at it.
     *
     * A range running backwards is not this rule's business: the Form Request refuses it
     * on the field, where a form can show it, and here it simply covers no days.
     *
     * @throws ActionError when the range is too wide
     */
    private function assertRangeIsNarrowEnough(Carbon $opensOn, Carbon $closesOn): void
    {
        $days = (int) $opensOn->diffInDays($closesOn) + 1;

        if ($days > self::MAX_RANGE_DAYS) {
            throw new ActionError(
                message: 'Khoảng ngày không được rộng hơn '.self::MAX_RANGE_DAYS.' ngày.',
                code: ScheduleError::DateRangeTooWide,
            );
        }
    }
}
