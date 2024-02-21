# ennovation_devweek
Made for DevWeek 2024

Command is: 

```
oc new-app https://github.com/VersatileVats/ennovation_devweek --image-stream="openshift/php:8.0-ubi8" -l app.kubernetes.io/part-of=openshift-hub --name=openshift-app --env=server_url=    --env=model_url=
```

```
oc create route edge --service=openshift-app
```
