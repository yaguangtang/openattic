��    &      L      |      |     }     �     �     �     �  '   �     �               *     /  %   B  S   h  H   �  I        O  J   e     �     �  _   �     3  "   @     c     o  	   |     �     �  S   �     �     �  	   �  ,         -     9     A     O     V  �  _     �          1     @     L  *   l  	   �     �     �     �     �  (   �  c   �  l   `	  X   �	     &
  H   =
     �
     �
  e   �
       -   #     Q     ]     u  	   �  	   �  V   �     �  	   �  
     )        <     \     p     |  	   �   Add DRBD Device Address (Peer) Address (here) C: Synchronous Call the fence-peer handler. Call the local-io-error handler script. Cancel Connection state Create DRBD Device DRBD Delete DRBD Device Detach and continue in diskless mode. Discard the node who has not written any changes. If both have changes, disconnect. Discard the node with the least changes and sync from the one with most. Discard the older Primary and sync from the host who last became primary. Discard the secondary Discard the younger Primary and sync from the host who was primary before. Disk state (here) Edit DRBD Device If the current secondary has the right data, call the pri-lost-after-sb handler on the primary. No Primaries No fencing actions are undertaken. One Primary Peer Address Peer Host Protocol Reload Report the I/O error to the file system on the primary, ignore it on the secondary. Role Secret Select... Simply disconnect without resynchronization. Syncer Rate Timeout Two Primaries Volume protocol Project-Id-Version: PACKAGE VERSION
Report-Msgid-Bugs-To: 
POT-Creation-Date: 2011-11-02 09:27+0100
PO-Revision-Date: 2011-11-02 15:21
Last-Translator: Laura Paduano <laura.paduano@it-novum.com>
Language-Team: LANGUAGE <LL@li.org>
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 8bit
Language: 
Plural-Forms: nplurals=2; plural=(n != 1)
X-Translated-Using: django-rosetta 0.6.0
 Füge DRBD Laufwerk hinzu Adresse der Gegenstelle eigene Adresse C: Synchron Rufe den fence-peer Handler auf Rufe das local-io-error Handler Script auf Abbrechen Verbinungsstatus Lösche DRBD  DRBD Lösche DRBD  Trennen und im diskless-Modus fortfahren Lösche den node, der keine Änderungen geschrieben hat. Wenn beide nodes Veränderungen aufzeigen. Verwerfe den node mit den wenigsten Änderungen und synchronisiere von dem, der die meisten Änderungen hat. Verwerfe den alten Primary und synchronisieren von dem Host, der als letztes Primary war Verwerfe den Secondary Verwerfe den jüngeren Primary und synchronisiere vom vorherigen Primary Disk Status  Füge DRBD Laufwerk hinzu Wenn der aktuelle Secondary die richtigen Daten hat, rufe den pri-lost-sb Handler auf dem Primary auf Keine Primaries Es wurden keine fencing-Aktionen unternommen  Ein Primary Adresse der Gegenstelle Gegenstelle Protokoll Neu laden Melde den I/O error dem Dateisystem des Primary, ignoriere den Error auf dem Secondary Rolle (Funktion) Verborgen Auswahl... Verbindung trennen ohne Resynchronisation Synchronisationsgeschwindigkeit Zeitüberschreitung 2 Primaries Volume Protokoll 