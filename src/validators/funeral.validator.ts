// src/validators/funeral.validator.ts

import { z } from 'zod';

// Notification contact schema
const notificationContactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number")
    .optional(),
  relationship: z.string().optional(),
});

// Do not notify schema
const doNotNotifySchema = z.object({
  name: z.string().min(2, "Name is required"),
  reason: z.string().optional(),
});

// Religion specific preferences
const hinduPreferencesSchema = z.object({
  antyesti_day: z.string().optional(),
  asthi_visarjan_location: z.string().optional(),
  pandit_required: z.boolean().optional(),
  pandit_name: z.string().optional(),
  gotra: z.string().optional(),
  shraddh_required: z.boolean().optional(),
  pind_daan_location: z.string().optional(),
}).optional();

const muslimPreferencesSchema = z.object({
  ghusl_arranger: z.string().optional(),
  burial_within_hours: z.number().optional(),
  masjid_name: z.string().optional(),
  qibla_direction_confirmed: z.boolean().optional(),
  imam_name: z.string().optional(),
}).optional();

const christianPreferencesSchema = z.object({
  church_name: z.string().optional(),
  pastor_name: z.string().optional(),
  wake_required: z.boolean().optional(),
  wake_duration_hours: z.number().optional(),
  denomination: z.string().optional(),
}).optional();

const sikhPreferencesSchema = z.object({
  gurdwara_name: z.string().optional(),
  akhand_path_required: z.boolean().optional(),
  ardas_location: z.string().optional(),
  kirtan_required: z.boolean().optional(),
}).optional();

const buddhistPreferencesSchema = z.object({
  monastery_name: z.string().optional(),
  monks_required: z.boolean().optional(),
  number_of_monks: z.number().optional(),
  chanting_duration_days: z.number().optional(),
}).optional();

const jainPreferencesSchema = z.object({
  sect: z.enum(['digambara', 'shvetambara']).optional(),
  muni_required: z.boolean().optional(),
  fasting_observation: z.boolean().optional(),
}).optional();

const zoroastrianPreferencesSchema = z.object({
  tower_of_silence: z.boolean().optional(),
  dastur_name: z.string().optional(),
  navjote_completed: z.boolean().optional(),
}).optional();

const religiousPreferencesSchema = z.object({
  hindu: hinduPreferencesSchema,
  muslim: muslimPreferencesSchema,
  christian: christianPreferencesSchema,
  sikh: sikhPreferencesSchema,
  buddhist: buddhistPreferencesSchema,
  jain: jainPreferencesSchema,
  zoroastrian: zoroastrianPreferencesSchema,
}).optional();

export const upsertFuneralPreferencesSchema = z.object({
  rite_type: z.enum([
    'cremation',
    'burial',
    'water_burial',
    'sky_burial',
    'other',
  ]).optional(),
  preferred_city: z.string().optional(),
  preferred_state: z.string().optional(),
  preferred_venue: z.string().optional(),
  religious_preferences: religiousPreferencesSchema,
  flower_preference: z.enum([
    'flowers',
    'no_flowers',
    'donation_instead',
  ]).optional(),
  music_preference: z.enum([
    'bhajans',
    'hymns',
    'silence',
    'classical',
    'specific_songs',
    'none',
  ]).optional(),
  music_details: z.string().optional(),
  attire_preference: z.string().optional(),
  food_for_mourners: z.enum([
    'vegetarian',
    'non_vegetarian',
    'no_food',
  ]).optional(),
  charity_name: z.string().optional(),
  notification_contacts: z.array(notificationContactSchema).optional(),
  do_not_notify: z.array(doNotNotifySchema).optional(),
  special_wishes: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UpsertFuneralPreferencesInput = z.infer <
  typeof upsertFuneralPreferencesSchema
>;