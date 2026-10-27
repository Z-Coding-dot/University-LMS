<?php

namespace Database\Factories;

use App\Models\Upload;
use Illuminate\Database\Eloquent\Factories\Factory;

class UploadFactory extends Factory
{
    protected $model = Upload::class;
    public function definition(): array { return ['uploader_id' => \App\Models\User::factory()->teacher(), 'offering_id' => \App\Models\CourseOffering::factory(), 'purpose' => 'lecture', 'original_name' => 'notes.pdf', 'path' => 'uploads/'.fake()->uuid().'.pdf', 'size' => 1024, 'mime_type' => 'application/pdf']; }
}
