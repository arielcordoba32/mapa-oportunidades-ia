$url = "https://hdlaxxxiqvdcmxbwacsf.supabase.co/rest/v1/opportunities"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkbGF4eHhpcXZkY214YndhY3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2Nzc4NTAsImV4cCI6MjA5NzI1Mzg1MH0.4CTmNZwpzWIRWmu7kE2TLpuBgirokdt1M2P0pJD6TWs"

$data = @{
    name        = "App de rutas de reparto con IA"
    city        = "Buenos Aires"
    country     = "Argentina"
    problem     = "Los repartidores pierden hasta 2 horas diarias por rutas ineficientes, sin considerar el trafico en tiempo real ni la prioridad de los pedidos urgentes."
    ai_solution = "Una IA que analiza trafico en tiempo real, historial de entregas y ventanas horarias para generar la ruta optima automaticamente. Reduce costos logisticos un 35%."
    category    = "Transporte"
    potential   = "Alto"
    likes       = 0
}

$json = $data | ConvertTo-Json -Compress

$headers = @{
    "apikey"        = $key
    "Authorization" = "Bearer $key"
    "Content-Type"  = "application/json"
    "Prefer"        = "return=representation"
}

$response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $json
Write-Host "Insertado correctamente:"
$response | ConvertTo-Json
