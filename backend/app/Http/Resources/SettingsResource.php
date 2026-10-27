<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SettingsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return $this->resource->only(['pass_mark', 'letter_scale', 'attendance_counted_statuses', 'attendance_warning_threshold', 'weekend_days']);
    }
}
