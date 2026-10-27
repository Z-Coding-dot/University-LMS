<?php
namespace App\Http\Requests;
use App\Enums\Role;
class SubmissionRequest extends StrictFormRequest
{
    public function authorize(): bool { return $this->user()->role === Role::Student; }
    public function rules(): array { return ['file_ids' => ['required', 'array', 'between:1,5'], 'file_ids.*' => ['required', 'integer', 'min:1', 'distinct']]; }
}
