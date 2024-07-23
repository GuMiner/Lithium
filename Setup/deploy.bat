REM With Bitvise SSH, conveniently deploy the whole website

REM Stop the site
sexec root@146.190.161.9:22 -cmd="supervisorctl stop lithium" -pk=auto

REM Copy over what may have changed 
(
echo cd /home/lithium/site
echo lcd C:\Users\gusgr\Desktop\lithium

echo put -mirror -erase templates templates
echo put -mirror -erase pages pages
echo put -o app.py

echo cd /home/lithium/site/static
echo lcd C:\Users\gusgr\Desktop\lithium\static
echo put -o lobby.js
echo put -o lobby.js.map
) | sftpc root@146.190.161.9:22 -pk=auto

REM add the following line to the above if the DB changes:
REM echo put -mirror -erase db db

REM add the following line to the above if doing more than JS changes to the static site content:
REM echo put -mirror -erase static static

REM Start the site
sexec root@146.190.161.9:22 -cmd="supervisorctl start lithium" -pk=auto