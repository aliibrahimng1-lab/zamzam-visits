$path = ".git"
$acl = Get-Acl $path
$acl.SetAccessRuleProtection($true, $false)
$acl.Access | ForEach-Object { $acl.RemoveAccessRuleAll($_) } | Out-Null
$users = @("DESKTOP-R30FCBB\\DELL", "SYSTEM", "BUILTIN\\Administrators")
foreach ($u in $users) {
  $r = New-Object System.Security.AccessControl.FileSystemAccessRule(
    $u,
    "FullControl",
    "ContainerInherit,ObjectInherit",
    "None",
    "Allow"
  )
  $acl.AddAccessRule($r) | Out-Null
}
Set-Acl $path $acl
