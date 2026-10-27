<?php
namespace App\Http\Requests;
class UploadRequest extends StrictFormRequest
{
    public function rules(): array { return ['offering_id' => ['required', 'integer', 'min:1'], 'purpose' => ['required', 'in:submission,assignment,lecture'], 'files' => ['required', 'array', 'between:1,5'], 'files.*' => ['required', 'file', 'max:5120']]; }
}
