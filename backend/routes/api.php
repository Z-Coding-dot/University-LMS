<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Profile\ProfileController;
use App\Http\Controllers\Api\V1\Catalog\CatalogController;
use App\Http\Controllers\Api\V1\Settings\SettingsController;
use App\Http\Controllers\Api\V1\Admin\{StudentController, TeacherController};
use Illuminate\Support\Facades\Route;

Route::pattern('id', '[0-9]+');
Route::pattern('lectureId', '[0-9]+');

Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:lms-login')->name('auth.login');
Route::middleware(['auth:sanctum', 'active', 'password.changed'])->group(function () {
    Route::get('dashboard', [\App\Http\Controllers\Api\V1\Dashboard\DashboardController::class, 'index']);
    Route::get('dashboard/{feed}', [\App\Http\Controllers\Api\V1\Dashboard\DashboardController::class, 'feed'])->whereIn('feed', ['tasks', 'files', 'work', 'submissions', 'grades']);
    Route::get('courses/{id}/lectures', [\App\Http\Controllers\Api\V1\Lecture\LectureController::class, 'index']);
    Route::post('courses/{id}/lectures', [\App\Http\Controllers\Api\V1\Lecture\LectureController::class, 'store']);
    Route::patch('courses/{id}/lectures/{lectureId}', [\App\Http\Controllers\Api\V1\Lecture\LectureController::class, 'update']);
    Route::get('assignments', [\App\Http\Controllers\Api\V1\Assignment\AssignmentController::class, 'index']);
    Route::get('assignments/{id}', [\App\Http\Controllers\Api\V1\Assignment\AssignmentController::class, 'show']);
    Route::post('assignments', [\App\Http\Controllers\Api\V1\Assignment\AssignmentController::class, 'store']);
    Route::patch('assignments/{id}', [\App\Http\Controllers\Api\V1\Assignment\AssignmentController::class, 'update']);
    Route::get('assignments/{id}/submissions', [\App\Http\Controllers\Api\V1\Submission\SubmissionController::class, 'index']);
    Route::post('assignments/{id}/submissions', [\App\Http\Controllers\Api\V1\Submission\SubmissionController::class, 'store']);
    Route::patch('submissions/{id}', [\App\Http\Controllers\Api\V1\Submission\SubmissionController::class, 'update']);
    Route::post('uploads', \App\Http\Controllers\Api\V1\Upload\UploadController::class);
    Route::get('files/{id}', \App\Http\Controllers\Api\V1\File\FileController::class);
    Route::get('announcements', [\App\Http\Controllers\Api\V1\Announcement\AnnouncementController::class, 'index']);
    Route::post('announcements', [\App\Http\Controllers\Api\V1\Announcement\AnnouncementController::class, 'store']);
    Route::patch('announcements/{id}', [\App\Http\Controllers\Api\V1\Announcement\AnnouncementController::class, 'update']);
    Route::get('courses', [\App\Http\Controllers\Api\V1\Course\CourseController::class, 'index']);
    Route::get('courses/{id}', [\App\Http\Controllers\Api\V1\Course\CourseController::class, 'show']);
    foreach (['weeks' => 'weeks', 'roster' => 'roster', 'grade-breakdown' => 'breakdown'] as $path => $action) Route::get('courses/{id}/'.$path, [\App\Http\Controllers\Api\V1\Course\CourseController::class, $action]);
    Route::get('courses/{id}/attendance-history', [\App\Http\Controllers\Api\V1\Attendance\AttendanceController::class, 'history']);
    Route::get('courses/{id}/attendance', [\App\Http\Controllers\Api\V1\Attendance\AttendanceController::class, 'show']);
    Route::post('courses/{id}/attendance', [\App\Http\Controllers\Api\V1\Attendance\AttendanceController::class, 'store']);
    Route::get('courses/{id}/grades', [\App\Http\Controllers\Api\V1\Grade\GradeController::class, 'show']);
    Route::put('courses/{id}/grades', [\App\Http\Controllers\Api\V1\Grade\GradeController::class, 'update']);
    Route::put('courses/{id}/grade-components', [\App\Http\Controllers\Api\V1\Grade\GradeController::class, 'components']);
    Route::put('courses/{id}/grade-status', [\App\Http\Controllers\Api\V1\Grade\GradeController::class, 'status']);
    Route::get('results', [\App\Http\Controllers\Api\V1\Result\ResultController::class, 'index']);
    Route::get('results/courses', [\App\Http\Controllers\Api\V1\Result\ResultController::class, 'index']);
    Route::get('timetable', \App\Http\Controllers\Api\V1\Timetable\TimetableController::class);
    Route::get('auth/me', [AuthController::class, 'me'])->name('auth.me');
    Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
    Route::patch('profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('profile/password', [ProfileController::class, 'password'])->name('profile.password');
    Route::get('profile/context', [ProfileController::class, 'context'])->name('profile.context');
    Route::get('settings', SettingsController::class)->name('settings.show');
    Route::get('catalog', CatalogController::class)->name('catalog.show');
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('catalog', [\App\Http\Controllers\Api\V1\Admin\AcademicController::class, 'catalog']);
        Route::get('teacher-activity', [\App\Http\Controllers\Api\V1\Admin\AcademicController::class, 'activity']);
        Route::put('settings', \App\Http\Controllers\Api\V1\Admin\SettingsController::class);
        Route::get('locked-grades', [\App\Http\Controllers\Api\V1\Admin\OfferingController::class, 'index'])->name('admin.locked');
        foreach (['get' => 'index', 'post' => 'store'] as $method => $action) {
            Route::$method('structure/{resource}', [\App\Http\Controllers\Api\V1\Admin\StructureController::class, $action]);
            Route::$method('offerings', [\App\Http\Controllers\Api\V1\Admin\OfferingController::class, $action]);
        }
        foreach (['patch' => 'update', 'delete' => 'destroy'] as $method => $action) {
            Route::$method('structure/{resource}/{id}', [\App\Http\Controllers\Api\V1\Admin\StructureController::class, $action]);
            Route::$method('offerings/{id}', [\App\Http\Controllers\Api\V1\Admin\OfferingController::class, $action]);
        }
        Route::get('offerings/{id}/candidates', [\App\Http\Controllers\Api\V1\Admin\OfferingController::class, 'candidates']);
        Route::post('offerings/{id}/enrollments', [\App\Http\Controllers\Api\V1\Admin\OfferingController::class, 'enrollments']);
        Route::put('offerings/{id}/schedule', [\App\Http\Controllers\Api\V1\Admin\OfferingController::class, 'schedule']);
        foreach (['student' => StudentController::class, 'teacher' => TeacherController::class] as $role => $controller) {
            $prefix = $role.'s';
            foreach ([['get', '', 'index'], ['post', '', 'store'], ['patch', '/{id}', 'update'], ['post', '/{id}/reset-password', 'resetPassword'], ['patch', '/{id}/status', 'status']] as [$method, $suffix, $action]) {
                Route::$method($prefix.$suffix, [$controller, $action])->defaults('managed_role', $role)->name('admin.'.$prefix.'.'.$action);
            }
        }
        Route::patch('students/{id}/academic-profile', [StudentController::class, 'academicProfile'])->defaults('managed_role', 'student')->name('admin.students.academicProfile');
        Route::put('teachers/{id}/permissions', [TeacherController::class, 'permissions'])->defaults('managed_role', 'teacher')->name('admin.teachers.permissions');
    });
});
