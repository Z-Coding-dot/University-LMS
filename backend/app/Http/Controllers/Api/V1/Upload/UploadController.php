<?php
namespace App\Http\Controllers\Api\V1\Upload;
use App\Http\Controllers\Controller;
use App\Http\Requests\UploadRequest;
use App\Http\Resources\AcademicResource;
use App\Services\Files\UploadService;
use App\Support\ApiResponse;
class UploadController extends Controller
{
    public function __invoke(UploadRequest $r, UploadService $s) { return ApiResponse::data(AcademicResource::collection($s->store($r->user(), $r->integer('offering_id'), $r->validated('purpose'), $r->file('files'))), 201); }
}
