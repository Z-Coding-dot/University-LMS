<?php
namespace App\Http\Controllers\Api\V1\File;
use App\Http\Controllers\Controller;
use App\Models\Upload;
use App\Services\Files\UploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
class FileController extends Controller
{
    public function __invoke(Request $r, int $id, UploadService $s) { $f = Upload::findOrFail($id); $s->download($r->user(), $f); abort_unless(Storage::disk('local')->exists($f->path), 404); return Storage::disk('local')->download($f->path, $f->original_name, ['Content-Type' => $f->mime_type, 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'no-store, private']); }
}
