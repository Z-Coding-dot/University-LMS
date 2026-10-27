<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\StructureResource;
use App\Models\{AcademicYear, Course, Department, Faculty, Semester};
use App\Support\ApiResponse;

class CatalogController extends Controller
{
    public function __invoke()
    {
        return ApiResponse::data(['semesters' => StructureResource::collection(Semester::orderBy('starts_at')->get()), 'departments' => StructureResource::collection(Department::orderBy('id')->get()), 'faculties' => StructureResource::collection(Faculty::orderBy('id')->get()), 'academic_years' => StructureResource::collection(AcademicYear::orderBy('starts_at')->get()), 'courses' => StructureResource::collection(Course::orderBy('code')->get())]);
    }
}
