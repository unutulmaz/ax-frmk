git  rm -r --cached app-modules/demo
git commit -m "remove folder"
git push origin master
git check-ignore -v -n app-modules/demo
pause
