<?php

namespace App\Enums;

enum Permission: string
{
    case TakeAttendance = 'attendance.take';
    case EnterGrades = 'grades.enter';
    case PublishGrades = 'grades.publish';
    case ManageAssignments = 'assignments.manage';
    case ManageMaterials = 'materials.manage';
    case PostAnnouncements = 'announcements.post';
    case ViewTimetable = 'timetable.view';
    case UnlockGrades = 'grades.unlock';

    public static function teacherGrants(): array
    {
        return array_values(array_filter(array_column(self::cases(), 'value'), fn ($value) => $value !== self::UnlockGrades->value));
    }
}
