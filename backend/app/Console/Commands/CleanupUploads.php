<?php
namespace App\Console\Commands;
use App\Models\Upload;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\{DB, Storage};
class CleanupUploads extends Command
{
    protected $signature = 'lms:cleanup-uploads';
    protected $description = 'Delete unattached private uploads older than 24 hours';
    public function handle(): int {
        $count = 0;
        Upload::where('created_at', '<', now()->subDay())->select('id')->chunkById(100, function ($rows) use (&$count) { foreach ($rows as $row) DB::transaction(function () use ($row, &$count) {
            $f = Upload::whereKey($row->id)->lockForUpdate()->first();
            if (!$f || $f->lectures()->exists() || $f->assignments()->exists() || $f->submissions()->exists()) return;
            if (Storage::disk('local')->exists($f->path) && !Storage::disk('local')->delete($f->path)) return;
            $f->delete(); $count++;
        }); });
        $this->info('Removed '.$count.' unattached uploads.'); return self::SUCCESS;
    }
}
