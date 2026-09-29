import * as migration_20260929_012812_initial from './20260929_012812_initial';

export const migrations = [
  {
    up: migration_20260929_012812_initial.up,
    down: migration_20260929_012812_initial.down,
    name: '20260929_012812_initial'
  },
];
