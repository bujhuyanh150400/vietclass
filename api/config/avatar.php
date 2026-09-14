<?php

/**
 * Build the `variantNN` names a DiceBear component declares, so a long allow-list
 * mirrors the installed style definition without 45 hand-typed strings drifting
 * out of step with it.
 *
 * @return list<string>
 */
$numbered = static fn (int $count): array => array_map(
    static fn (int $index): string => sprintf('variant%02d', $index),
    range(1, $count),
);

/**
 * Build the `long01`/`short01` hair names Adventurer declares, which is the only
 * option the sample-avatar picker sets: a long variant reads as female, a short one
 * as male, and everything else about the face comes from the seed.
 *
 * @return list<string>
 */
$hair = static fn (int $long, int $short): array => [
    ...array_map(static fn (int $index): string => sprintf('long%02d', $index), range(1, $long)),
    ...array_map(static fn (int $index): string => sprintf('short%02d', $index), range(1, $short)),
];

/*
 * The DiceBear styles this application accepts, and for each one the exact option
 * surface `AvatarSelection` will validate against.
 *
 * Adventurer is the only one, because the sample-avatar picker is the only thing that
 * builds a DiceBear avatar and it builds nothing else. Three further styles were
 * declared here while the picker exposed a raw style/seed/option editor; that editor
 * is gone, so they accepted values nothing could produce.
 *
 * Adding a style back means adding it in three places that mirror each other: here,
 * `frontend/src/modules/avatar/schemas/avatar-schema.ts`, and the `STYLES` map in
 * `frontend/src/modules/avatar/utils/dicebear.ts`.
 */
return [
    'styles' => [
        'adventurer' => [
            'components' => ['details', 'earrings', 'eyebrows', 'eyes', 'glasses', 'hair', 'head', 'mouth'],
            'colors' => ['earrings', 'eyes', 'glasses', 'hair', 'ink', 'lips', 'sclera', 'skin', 'teeth', 'throat', 'tongue', 'uvula'],
            'variants' => [
                'details' => ['birthmark', 'blush', 'freckles', 'mustache'],
                'earrings' => $numbered(6),
                'eyebrows' => $numbered(15),
                'eyes' => $numbered(26),
                'glasses' => $numbered(5),
                'hair' => $hair(26, 19),
                'head' => ['default'],
                'mouth' => $numbered(30),
            ],
        ],
    ],
];
