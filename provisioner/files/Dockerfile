FROM ubuntu:14.04

ENV S3_TMP /tmp/s3cmd.zip
ENV S3_ZIP /tmp/s3cmd-master
ENV RDS_TMP /tmp/RDSCLi.zip
ENV RDS_VERSION 1.19.004

# Install java8
RUN apt-get update && apt-get install -y software-properties-common && apt-get clean && rm -fr /var/lib/apt/lists/* /tmp/* /var/tmp/*
RUN add-apt-repository -y ppa:webupd8team/java
RUN echo oracle-java8-installer shared/accepted-oracle-license-v1-1 select true | /usr/bin/debconf-set-selections
RUN apt-get update && apt-get install -y oracle-java8-installer && apt-get clean && rm -fr /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install Deps
RUN dpkg --add-architecture i386 && apt-get update && apt-get install -y --force-yes \
expect \
git \
wget \
libc6-i386 \
lib32stdc++6 \
lib32gcc1 \
lib32ncurses5 \
lib32z1 \
python \
python-pip \
curl \
make \
wget \
tar \
unzip \
&& apt-get clean && rm -fr /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install aws sdk
RUN pip install --upgrade \
  awscli \
  pip \
  python-dateutil &&\
ln -s /usr/bin/aws_bash_completer /etc/profile.d/aws_bash_completer.sh &&\
curl -sSL --output ${S3_TMP} https://github.com/s3tools/s3cmd/archive/master.zip &&\
curl -sSL --output ${RDS_TMP} http://s3.amazonaws.com/rds-downloads/RDSCli.zip &&\
unzip -q ${S3_TMP} -d /tmp &&\
unzip -q ${RDS_TMP} -d /tmp &&\
mv ${S3_ZIP}/S3 ${S3_ZIP}/s3cmd /usr/bin/ &&\
mv /tmp/RDSCli-${RDS_VERSION} /usr/local/ &&\
rm -rf /tmp/* &&\
mkdir ~/.aws &&\
chmod 700 ~/.aws/

# Install gcloud
RUN mkdir -p /opt/gcloud && \
    wget --no-check-certificate --directory-prefix=/tmp/ https://dl.google.com/dl/cloudsdk/release/google-cloud-sdk.zip && \
    unzip /tmp/google-cloud-sdk.zip -d /opt/ && \
    /opt/google-cloud-sdk/install.sh --usage-reporting=true --path-update=true --bash-completion=true --rc-path=/opt/gcloud/.bashrc --disable-installation-options && \
    /opt/google-cloud-sdk/bin/gcloud --quiet components update app preview alpha beta app-engine-java app-engine-python kubectl bq core gsutil gcloud && \
    rm -rf /tmp/*

# Setup environment
ENV ANDROID_HOME /opt/android-sdk-linux
ENV ANDROID_SDK_HOME /opt/android-sdk-linux
ENV ANDROID_SDK_ROOT /opt/android-sdk-linux
ENV ANDROID_NDK_HOME /opt/android-ndk
ENV ANDROID_NDK_ROOT /opt/android-ndk
ENV PATH ${PATH}:${ANDROID_HOME}/tools:${ANDROID_HOME}/platform-tools
ENV AWS_RDS_HOME /usr/local/RDSCli-${RDS_VERSION}
ENV PATH ${PATH}:${AWS_RDS_HOME}/bin:${JAVA_HOME}/bin:${AWS_RDS_HOME}
ENV PATH /opt/google-cloud-sdk/bin:$PATH
ENTRYPOINT cd /opt/src && /opt/src/rocket.sh
