<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Maatwebsite\Excel\Facades\Excel;

class TestHeaderCommand extends Command
{
    protected $signature = 'test:header';

    public function handle()
    {
        $data = Excel::toArray(new class implements \Maatwebsite\Excel\Concerns\WithHeadingRow {}, 'DP.Proyek.xlsx');
        if (!empty($data) && !empty($data[0])) {
            print_r(array_keys($data[0][0]));
        }
    }
}
