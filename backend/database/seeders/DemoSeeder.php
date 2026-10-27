<?php
namespace Database\Seeders;
use App\Models\{User, Faculty, Department, AcademicYear, Semester, Course, CourseOffering, Enrollment, GradeComponent, GradeEntry, AttendanceSession, AttendanceRecord, Lecture, Assignment, Submission, Announcement, AcademicSetting, InstitutionalSequence, Upload};
use App\Support\AcademicValidation;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\{DB, Hash, Storage};
class DemoSeeder extends Seeder
{
    private function create(string $class, array $row): Model {
        $model = new $class;
        $model->forceFill(array_intersect_key(AcademicValidation::attributes($row), array_flip(array_merge($model->getFillable(), ['id', 'created_at', 'updated_at']))))->save(); return $model;
    }
    private function translated(array $row, array $fields): array {
        $row['translations'] = [];
        foreach ($fields as $key) if (is_string($row[$key] ?? null) && str_contains($row[$key], ' / ')) { [$fa, $en] = explode(' / ', $row[$key], 2); $row['translations'][$key] = ['fa' => $fa, 'en' => $en]; }
        return $row;
    }
    public function run(): void {
        if (app()->environment('production')) throw new \RuntimeException('DemoSeeder is forbidden in production.');
        if (User::exists() || CourseOffering::exists() || Faculty::exists()) throw new \RuntimeException('DemoSeeder requires an empty development database; it never replaces existing records.');
        $f = json_decode(file_get_contents(database_path('fixtures/demo.json')), true, 512, JSON_THROW_ON_ERROR);
        DB::transaction(function () use ($f) {
            foreach (['faculties' => Faculty::class, 'departments' => Department::class, 'academicYears' => AcademicYear::class, 'semesters' => Semester::class, 'courses' => Course::class] as $key => $class) foreach ($f[$key] as $row) $this->create($class, $row);
            foreach ($f['users'] as $row) {
                $permissions = $row['permissions']; $profile = $row['profile']; unset($row['permissions'], $row['profile']);
                $row += $profile; $row['password'] = Hash::make($row['role'] === 'student' ? 'Student'.substr($profile['institutional_id'], 3).'!Campus' : 'Campus123!');
                $user = $this->create(User::class, $row); foreach ($permissions as $permission) $user->permissions()->create(['permission' => $permission]);
            }
            foreach (['AD' => 1, 'TC' => 3, 'ST' => 25] as $prefix => $number) InstitutionalSequence::where('prefix', $prefix)->update(['number' => $number]);
            $this->create(AcademicSetting::class, ['id' => 1] + $f['settings']);
            foreach ($f['offerings'] as $row) { $row['grade_status'] = $row['id'] < 4 ? 'locked' : ($row['id'] < 6 ? 'published' : 'draft'); $o = $this->create(CourseOffering::class, $row); foreach ($row['schedule'] as $slot) $o->schedule()->create(collect($slot)->except('id')->all()); }
            foreach (['enrollments' => Enrollment::class, 'gradeComponents' => GradeComponent::class, 'gradeEntries' => GradeEntry::class, 'attendanceSessions' => AttendanceSession::class, 'attendanceRecords' => AttendanceRecord::class] as $key => $class) foreach ($f[$key] as $row) $this->create($class, $row);
            foreach (['lectures' => [Lecture::class, 'lecture'], 'assignments' => [Assignment::class, 'assignment']] as $key => [$class, $purpose]) foreach ($f[$key] as $row) {
                $content = $this->create($class, $this->translated($row, ['title', 'description'])); $o = CourseOffering::findOrFail($row['offering_id']);
                foreach ($row['attachments'] as $attachment) {
                    $path = 'demo/'.$o->id.'-'.$purpose.'-'.$attachment['name'];
                    $upload = Upload::firstOrCreate(['path' => $path], ['uploader_id' => $o->teacher_id, 'offering_id' => $o->id, 'purpose' => $purpose, 'original_name' => $attachment['name'], 'size' => $attachment['size'], 'mime_type' => $attachment['mime_type'], 'created_at' => CarbonImmutable::parse($attachment['created_at'])]);
                    if (!Storage::disk('local')->put($path, file_get_contents(database_path('fixtures/files/'.$attachment['name'])))) throw new \RuntimeException('Demo storage write failed');
                    $content->attachments()->syncWithoutDetaching([$upload->id]);
                }
            }
            foreach ($f['submissions'] as $row) $this->create(Submission::class, $this->translated($row, ['feedback']));
            foreach ($f['announcements'] as $row) $this->create(Announcement::class, $this->translated($row, ['title', 'body']));
        });
    }
}
