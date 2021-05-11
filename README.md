# GitHub Action - Build & Release RPM Packages

This GitHub Action is intended to build RPM and SRPM packages from a spec file and submit it as a release asset or an artifact to the same repository.

***Note:** Currently only support builds for Fedora `x86_64` releases.

# Inputs

- `spec_file`: Name of the spec file. **(required)**

# Outputs

- `rpm_path`: Path to the RPM package.
- `rpm_name`: Name of the RPM package.
- `srpm_path`: Path to the Source RPM package.
- `srpm_name`: Name of the Source RPM package.
- `content_type`: Content-type of the packages.

# Usage

## Pre-requisites

Create a GitHub workflow `.yml` file in the `.github/workflows` directory inside your repository. An [example](#example-workflow) is given below. For more information, reference the GitHub Help documentation for [creating a workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file).

## Fedora Release Version

You can specify the Fedora release version using the following syntax to build your RPM and/or SRPM packages for specific releases. Currently supported Fedora release versions are,
- latest (Fedora 34)
- f33 (Fedora 33)

Syntax:
```YAML
...
uses: AnjaloHettiarachchi/rpmbuild@{VERSION}-{FEDORA_VERSION}
...
```

# Example Workflow

```YAML
---
name: Build & Release RPM & SRPM packages

on:
  push:
    tags:
      - "v*"

jobs:
  build:
    name: Build and release as assets
    runs-on: ubuntu-latest

    steps:
      - name: Checkout the repository
        uses: actions/checkout@v2

      - name: Build RPM and SRPM packages
        id: rpm_build
        uses: AnjaloHettiarachchi/rpmbuild@v1.0.0
        with:
          spec_file: "my-app.spec"

      - name: Create a new release
        id: create_release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: ${{ github.ref }}
          body: |
            Changes in this Release
                - Create RPM
                - Upload Source RPM
          draft: false
          prerelease: false

      - name: Upload RPM as a release asset
        id: upload_rpm_release
        uses: actions/upload-release-asset@v1.0.2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ${{ steps.rpm_build.outputs.rpm_path }}
          asset_name: ${{ steps.rpm_build.outputs.rpm_name }}
          asset_content_type: ${{ steps.rpm_build.outputs.content_type }}

      - name: Upload SRPM as a release asset
        id: upload_srpm_release
        uses: actions/upload-release-asset@v1.0.2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ${{ steps.rpm_build.outputs.srpm_path }}
          asset_name: ${{ steps.rpm_build.outputs.srpm_name }}
          asset_content_type: ${{ steps.rpm_build.outputs.content_type }}

```

# References

- [RPM Packaging Guide](https://rpm-packaging-guide.github.io/)
- [GitHub Learning Lab](https://lab.github.com/)
- [Container Toolkit Action](https://github.com/actions/container-toolkit-action)