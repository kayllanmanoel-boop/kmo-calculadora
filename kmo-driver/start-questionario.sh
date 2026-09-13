#!/bin/sh
PORT=8002 KMO_DRIVER_INTERNAL_PORT=8001 python bootstrap.py &
sleep 2
exec env KMO_GATEWAY_INTERNAL_PORT=8002 python router2.py
