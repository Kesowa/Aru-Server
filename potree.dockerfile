FROM node:18
RUN apt-get update && apt-get -y install g++ git libtbb-dev

RUN wget https://github.com/Kitware/CMake/releases/download/v3.22.5/cmake-3.22.5-linux-x86_64.sh \
      -q -O /tmp/cmake-install.sh \
      && chmod u+x /tmp/cmake-install.sh \
      && mkdir /usr/bin/cmake \
      && /tmp/cmake-install.sh --skip-license --prefix=/usr/bin/cmake \
      && rm /tmp/cmake-install.sh

ENV PATH="/usr/bin/cmake/bin:${PATH}"

RUN mkdir /data
WORKDIR /data

RUN git clone https://github.com/potree/PotreeConverter.git .
RUN mkdir build 
WORKDIR /data/build
RUN cmake ../ && make
