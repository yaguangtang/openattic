#!/bin/bash

### BEGIN INIT INFO
# Provides: openattic-rpcd
# Required-Start: $local_fs $network $remote_fs openattic-systemd
# Required-Stop: $local_fs $network $remote_fs
# Default-Start:  2 3 4 5
# Default-Stop: 0 1 6
# Short-Description: openATTIC's XMLRPC interface daemon
# Description: handles communication with other hosts
### END INIT INFO


set -e
set -u

. /etc/default/openattic

if [ $# -lt 1 ]
then
	echo "$0 <start|stop|restart|status>"
	exit 1
fi

. /lib/lsb/init-functions

case $1 in
	start)
		log_daemon_msg "Starting" "openATTIC rpcd"
		if [ ! -z "$RPCD_CERTFILE" -a ! -z "$RPCD_KEYFILE" ]; then
			RPCD_OPTIONS="$RPCD_OPTIONS -c $RPCD_CERTFILE -k $RPCD_KEYFILE"
		fi
		start-stop-daemon --pidfile=$RPCD_PIDFILE --make-pidfile --background --oknodo --start \
			--exec $PYTHON --chdir $OADIR --chuid $RPCD_CHUID -- \
			$RPCD_OPTIONS -l $RPCD_LOGFILE -L $RPCD_LOGLEVEL -q
		log_end_msg 0
		;;
	
	stop)
		log_daemon_msg "Stopping" "openATTIC rpcd"
		start-stop-daemon --pidfile=$RPCD_PIDFILE --stop --oknodo --exec $PYTHON
		log_end_msg 0
		;;
	
	restart|reload)
		$0 stop
		$0 start
		;;
	
	status)
		if start-stop-daemon --pidfile=$RPCD_PIDFILE --test --stop --exec $PYTHON --quiet
		then
			PID=`cat $RPCD_PIDFILE`
			echo "rpcd is running (pid $PID)."
			exit 0
		else
			echo "rpcd is not running"
			exit 3
		fi
		;;
	
	probe)
		echo restart
		exit 0
		;;
	
	*)
		echo "Unknown command $1."
		exit 1
		;;
esac

