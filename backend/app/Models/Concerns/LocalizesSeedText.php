<?php
namespace App\Models\Concerns;
trait LocalizesSeedText
{
    private function seedText(string $key, mixed $value): mixed { return $this->translations[$key][app()->getLocale()] ?? $value; }
    public function getTitleAttribute($value) { return $this->seedText('title', $value); }
    public function getDescriptionAttribute($value) { return $this->seedText('description', $value); }
    public function getBodyAttribute($value) { return $this->seedText('body', $value); }
    public function getFeedbackAttribute($value) { return $this->seedText('feedback', $value); }
}
