#SingleInstance Force
MouseGetPos, xpos, ypos, 

^up::
MouseClickDrag, left, xpos, ypos, xpos, ypos-10

; ^down::
; MouseClickDrag, left, xpos, ypos, xpos, ypos+10

; ^left::
; MouseClickDrag, left, xpos, ypos, xpos-10, ypos

; ^right::
; MouseClickDrag, left, xpos, ypos, xpos+10, ypos
