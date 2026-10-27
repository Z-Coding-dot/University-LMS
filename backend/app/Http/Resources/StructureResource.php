<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StructureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = ['id' => $this->id, 'name' => isset($this->name_fa) ? ['fa' => $this->name_fa, 'en' => $this->name_en] : $this->name];
        foreach (['faculty_id', 'department_id', 'academic_year_id', 'code', 'credits'] as $field) {
            if (array_key_exists($field, $this->resource->getAttributes())) $data[$field] = $this->{$field};
        }
        foreach (['starts_at', 'ends_at'] as $field) {
            if (isset($this->{$field})) $data[$field] = $this->{$field}->format('Y-m-d');
        }
        return $data;
    }
}
