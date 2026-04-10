# homelab

I setup a homelab with 2 raspberry pi nodes, using k3s. 

pi-node-1 : 10.88.111.37 (master node)
pi-node-2 : 10.88.111.34 (worker node)


## Setting up the SD card for initial boot

Flash using the Raspberry Pi Imager: 
https://www.raspberrypi.com/software/

Use the raspbery pi os lite (64-bit)
Add blank file called `ssh` to the root of the SD card. 

Create a file called `userconf` in the same boot partition of the SD card. This file should contain a single line of text, consisting of {name}:{encrypted-password}

## Install k3s

sudo apt-get install vim

Update `/boot/firmware/cmdline.txt` to include:
```
cgroup_memory=1 cgroup_enable=memory
```


Install on first node: 
```
curl -sfL https://get.k3s.io | sh -
```

Get the tokens from the first node: 

sudo cat /var/lib/rancher/k3s/server/node-token


Set up the second node: 

export K3S_URL=https://10.88.111.37:6443
export K3S_TOKEN=<token>
curl -sfL https://get.k3s.io | sh -



# Scraping the kubeconfig from the first node

DELETE EXISTING KUBECONFIG `default` CONTEXT AND USER

Grab the kubeconfig from the node: 
ssh admin@10.88.111.37 "sudo cat /etc/rancher/k3s/k3s.yaml" > ~/.kube/config-k3s

Change local host in the kubeconfig to the ip, then merge with your existing kubeconfig:

export KUBECONFIG=~/.kube/config:~/.kube/config-k3s
kubectl config view --flatten > ~/.kube/config-merged
mv ~/.kube/config-merged ~/.kube/config


# Installing MetalLB
MetalLB provides traefik with Virtual IPs (VIPs) for ingress

```
helm repo add metallb https://metallb.github.io/metallb
helm repo update
helm install metallb metallb/metallb -n metallb-system --create-namespace
```


Set the address pool for metal lb using a range that is NOT used by your DHCP server, but still in your router's subnet. 

```
kubectl apply -f - <<EOF
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: default-pool
  namespace: metallb-system
spec:
  addresses:
    - 10.88.111.240-10.88.111.250
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: l2-adv
  namespace: metallb-system
EOF
```



Traefik overwrite to allow for TLS management

```
cat <<'YAML' | kubectl apply -f -
apiVersion: helm.cattle.io/v1
kind: HelmChartConfig
metadata:
  name: traefik
  namespace: kube-system
spec:
  valuesContent: |-
    additionalArguments:
      - --certificatesresolvers.le.acme.email=varun.mehrotra@webguru.ca
      - --certificatesresolvers.le.acme.storage=/data/acme.json
      - --certificatesresolvers.le.acme.httpchallenge=true
      - --certificatesresolvers.le.acme.httpchallenge.entrypoint=web

    ports:
      web:
        exposedPort: 80
        redirections:
          entryPoint:
            to: websecure
            scheme: https
            permanent: true

      websecure:
        exposedPort: 443
        tls:
          enabled: true

    persistence:
      enabled: true
      path: /data
      size: 1Gi
      accessMode: ReadWriteOnce

YAML
```

# Setup image pull secret: 
kubectl -n default create secret docker-registry ghcr-creds \
  --docker-server=ghcr.io \
  --docker-username="Varun-Mehrotra" \
  --docker-password="" \
  --docker-email="varun.mehrotra@webguru.ca" \


docker build -t ghcr.io/varun-mehrotra/private-llm-site:latest ./static-site
docker push ghcr.io/varun-mehrotra/private-llm-site:latest
kubectl rollout restart deployment static-site -n default

# Flux layout

Flux manifests are organized by namespace under `flux/<namespace>/`.

Current managed namespaces:
- `flux-system`
- `default`
- `kube-system`
- `metallb-system`
- `vicinity`
- `freshrss`

# Manual prerequisites

Secrets are still managed manually in this repo for now and must exist before Flux reconciliation can fully succeed for app workloads.

Required secrets:
- `default/ghcr-creds`
- `vicinity/ghcr-creds`
- `vicinity/vicinity-secrets`
- `freshrss/freshrss-bootstrap`

Expected keys:
- `ghcr-creds`: docker registry auth for `ghcr.io`
- `vicinity-secrets`: `supabase-url`, `supabase-anon-key`, `supabase-service-role-key`
- `freshrss-bootstrap`: `FRESHRSS_INSTALL`, `FRESHRSS_USER`

## FreshRSS setup

FreshRSS is managed by Flux in `flux/freshrss` and is exposed through Traefik at `https://rss.webguru.ca`.

Before Flux reconciles the FreshRSS manifests, create DNS for `rss.webguru.ca` pointing at the same public route used by the Traefik/MetalLB endpoint for `10.88.111.240`.

Create the bootstrap secret manually so admin credentials are not committed to Git:

```sh
kubectl create namespace freshrss

kubectl -n freshrss create secret generic freshrss-bootstrap \
  --from-literal=FRESHRSS_INSTALL='--api-enabled --base-url https://rss.webguru.ca --default-user admin --language en' \
  --from-literal=FRESHRSS_USER='--user admin --password <admin-password> --api-password <api-password> --email varun.mehrotra@webguru.ca --language en'
```

After Flux applies the manifests, verify the deployment:

```sh
kubectl get deploy,svc,ingress,pvc -n freshrss
kubectl logs -n freshrss deploy/freshrss
kubectl get ingress -n freshrss
```

# Audit commands

Use these commands after each migration step to compare Flux state with the live cluster:

```sh
helm list -A
kubectl get deploy,svc,ingress -A
kubectl get gitrepositories,kustomizations,helmrepositories,helmreleases -A
```

# Traefik management

Traefik remains installed and owned by k3s.

Flux manages only the `HelmChartConfig` override in `flux/kube-system` so the custom ACME, HTTPS redirect, and persistence settings stay in Git without replacing the packaged k3s release.
