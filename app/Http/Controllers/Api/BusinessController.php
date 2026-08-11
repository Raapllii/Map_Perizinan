<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBusinessRequest;
use App\Http\Requests\UpdateBusinessRequest;
use App\Services\BusinessService;
use Illuminate\Http\Request;

class BusinessController extends Controller
{
    protected $businessService;

    public function __construct(BusinessService $businessService)
    {
        $this->businessService = $businessService;
    }

    public function index(Request $request)
    {
        if ($request->boolean('map')) {
            $markers = $this->businessService->getBusinessesForMap($request);
            return response()->json($markers);
        }

        $data = $this->businessService->getBusinessesForDataTable($request);
        return response()->json($data);
    }

    public function search(Request $request)
    {
        $results = $this->businessService->search($request);
        return response()->json($results);
    }

    public function show($id)
    {
        $business = $this->businessService->show($id);
        return response()->json($business);
    }

    public function store(StoreBusinessRequest $request)
    {
        $business = $this->businessService->store($request->validated());
        return response()->json(['message' => 'Usaha berhasil ditambahkan', 'data' => $business], 201);
    }

    public function update(UpdateBusinessRequest $request, $id)
    {
        $business = $this->businessService->update($id, $request->validated());
        return response()->json(['message' => 'Data usaha berhasil diperbarui', 'data' => $business]);
    }

    public function destroy($id)
    {
        $this->businessService->destroy($id);
        return response()->json(['message' => 'Data usaha berhasil dihapus']);
    }
}
