#!/bin/bash
bytes_traffic=$(vnstat --json m 1 | jq "[.interfaces[].traffic.month[0].tx, .interfaces[].traffic.month[0].rx] | add")

# Limit set to 250 GiB, which is well over the usual monthly usage (~3 GiB) and well under the max limit.
bytes_limit=$(( 1024*1024*1024*250 ))
if (( bytes_traffic > bytes_limit ))
then
   echo "Limit hit ($bytes_traffic)! Shutting down..."

   # Delay a bit so that the server can be recovered if stuck in a boot loop.
   sleep 120

   # poweroff
fi

mb_traffic=$(( bytes_traffic / (1024*1024) ))
echo "Limit not hit. Traffic this month: $mb_traffic MiB"
