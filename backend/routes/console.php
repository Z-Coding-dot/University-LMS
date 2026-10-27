<?php

\Illuminate\Support\Facades\Schedule::command('lms:cleanup-uploads')->hourly()->withoutOverlapping();
